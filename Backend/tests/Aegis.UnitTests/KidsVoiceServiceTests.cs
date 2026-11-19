using System.Linq;
using Aegis.Infrastructure.Services;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace Aegis.UnitTests
{
    public class KidsVoiceServiceTests
    {
        [Fact]
        public void GetVoices_Vietnamese_Returns_Six_Age_And_Gender_Profiles()
        {
            var service = new KidsVoiceService(NullLogger<KidsVoiceService>.Instance);
            var viVoices = service.GetVoices("vi-VN");

            Assert.Equal(6, viVoices.Count);
            Assert.Equal(3, viVoices.Count(v => v.Gender == "Female"));
            Assert.Equal(3, viVoices.Count(v => v.Gender == "Male"));
            Assert.Contains(viVoices, v => v.Persona == "Kid" && v.Gender == "Female");
            Assert.Contains(viVoices, v => v.Persona == "Kid" && v.Gender == "Male");
            Assert.Contains(viVoices, v => v.Persona == "Youth" && v.Gender == "Female");
            Assert.Contains(viVoices, v => v.Persona == "Youth" && v.Gender == "Male");
            Assert.Contains(viVoices, v => v.Persona == "Storyteller" && v.Gender == "Female");
            Assert.Contains(viVoices, v => v.Persona == "Heroic" && v.Gender == "Male");
        }

        [Fact]
        public void ResolveVoicePreset_Maps_Age_Variants_To_Base_Neural_Voice_With_Prosody()
        {
            var (girlBase, girlPitch, _) = KidsVoiceService.ResolveVoicePreset("vi-VN-HoaiMyNeural#kid-girl", "vi-VN");
            Assert.Equal("vi-VN-HoaiMyNeural", girlBase);
            Assert.Equal("+28Hz", girlPitch);

            var (boyBase, boyPitch, _) = KidsVoiceService.ResolveVoicePreset("vi-VN-NamMinhNeural#kid-boy", "vi-VN");
            Assert.Equal("vi-VN-NamMinhNeural", boyBase);
            Assert.Equal("+34Hz", boyPitch);

            var (youthMBase, youthMPitch, _) = KidsVoiceService.ResolveVoicePreset("vi-VN-NamMinhNeural#youth-male", "vi-VN");
            Assert.Equal("vi-VN-NamMinhNeural", youthMBase);
            Assert.Equal("+12Hz", youthMPitch);
        }
    }
}
